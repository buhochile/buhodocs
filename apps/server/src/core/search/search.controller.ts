import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  NotImplementedException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDTO, SearchSuggestionDTO } from './dto/search.dto';
import { AuthWorkspace } from '../../decorators/auth-workspace.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { User, Workspace } from '@docmost/db/types/entity.types';
import SpaceAbilityFactory from '../casl/abilities/space-ability.factory';
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from '../casl/interfaces/space-ability.type';
import { AuthUser } from '../../decorators/auth-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly spaceAbility: SpaceAbilityFactory,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post()
  async pageSearch(@Body() searchDto: SearchDTO, @AuthUser() user: User) {
    if (searchDto.spaceId) {
      const ability = await this.spaceAbility.createForUser(
        user,
        searchDto.spaceId,
      );

      if (ability.cannot(SpaceCaslAction.Read, SpaceCaslSubject.Page)) {
        throw new ForbiddenException();
      }

      return this.searchService.searchPage(searchDto.query, searchDto);
    }

    // TODO: search all spaces user is a member of if no spaceId provided
    throw new NotImplementedException();
  }

  @Post('suggest')
  async searchSuggestions(
    @Body() dto: SearchSuggestionDTO,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.searchService.searchSuggestions(dto, workspace.id);
  }
}
